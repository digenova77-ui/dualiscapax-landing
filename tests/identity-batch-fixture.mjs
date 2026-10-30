// TEST_FIXTURE_ONLY. Serialized in-memory transaction model, not D1 evidence.
export function attachIdentityBatch(db, state) {
  const prepare = db.prepare.bind(db);
  db.prepare = (sql) => {
    const statement = prepare(sql);
    const bind = statement.bind.bind(statement);
    statement.bind = (...values) => {
      const bound = bind(...values);
      if (sql.includes("INSERT INTO identity_session") && sql.includes("SELECT session_hash")) {
        const originalRun = bound.run.bind(bound);
        bound.run = async () => {
          const rows = state.handoffs ?? (state.row ? [state.row] : []);
          const row = rows.find((proof) =>
            proof.state === "CONSUMED" &&
            proof.consumed_at === values[0] &&
            proof.session_hash === values[1] &&
            proof.jti_hash === values[2] &&
            proof.nonce_hash === values[3] &&
            proof.request_id === values[4] &&
            proof.proof_version === values[5] &&
            proof.subject_id === values[6] &&
            proof.action === values[7] &&
            proof.assertion_digest === values[8] &&
            proof.session_binding_hash === values[9] &&
            proof.revoked_at === null &&
            proof.expires_at > values[0]);
          if (!row) return { meta: { changes: 0 } };
          if (state.insertFailure) throw new Error("TEST_FIXTURE_ONLY insert failure");
          return originalRun();
        };
      }
      return bound;
    };
    return statement;
  };
  let tail = Promise.resolve();
  db.batch = (statements) => {
    const transaction = tail.then(async () => {
      const row = state.row && { ...state.row };
      const handoffs = state.handoffs?.map((proof) => ({ ...proof }));
      const sessions = [...state.sessions];
      try {
        const results = [];
        for (const statement of statements) {
          const result = await statement.run();
          results.push({ ...result, success: true });
        }
        return results;
      } catch (error) {
        if (row) Object.assign(state.row, row);
        if (handoffs) state.handoffs.splice(0, state.handoffs.length, ...handoffs);
        state.sessions.splice(0, state.sessions.length, ...sessions);
        throw error;
      }
    });
    tail = transaction.catch(() => {});
    return transaction;
  };
  return db;
}
