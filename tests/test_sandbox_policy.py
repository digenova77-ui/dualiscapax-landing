"""Regression tests for fail-closed worker sandbox policy planning."""
import unittest

from autonomy.sandbox_policy import (
    SandboxPolicy,
    build_launch_plan,
    validate_sandbox_policy,
)


def approved(**overrides):
    values = dict(
        policy_version="trinity-sandbox-v1",
        approved_task_id="task-123",
        authority_id="father-approved-ref-1",
        workspace_root="/srv/worker/task-123",
        allowed_read_paths=frozenset({"src", "tests"}),
        allowed_write_paths=frozenset({"out"}),
        allowed_environment=frozenset({"LANG"}),
        allowed_egress_hosts=frozenset(),
        network_enabled=False,
        accepted=True,
    )
    values.update(overrides)
    return SandboxPolicy(**values)


class SandboxPolicyTests(unittest.TestCase):
    def test_valid_policy_builds_deterministic_networkless_plan(self):
        policy = approved()
        decision = validate_sandbox_policy(policy, task_id="task-123", backend_attested=True)
        self.assertTrue(decision.allowed, decision.reasons)
        plan = build_launch_plan(policy, decision)
        self.assertFalse(plan.network_enabled)
        self.assertEqual(plan.egress_hosts, ())
        self.assertEqual(plan.read_paths, ("src", "tests"))
        self.assertEqual(plan.write_paths, ("out",))

    def test_missing_policy_fails_closed(self):
        decision = validate_sandbox_policy(None, task_id="task-123", backend_attested=True)
        self.assertFalse(decision.allowed)
        self.assertIn("sandbox_policy_missing", decision.reasons)

    def test_backend_attestation_is_required(self):
        decision = validate_sandbox_policy(approved(), task_id="task-123")
        self.assertFalse(decision.allowed)
        self.assertIn("trusted_sandbox_backend_not_attested", decision.reasons)

    def test_wrong_task_and_unaccepted_policy_are_denied(self):
        decision = validate_sandbox_policy(
            approved(accepted=False), task_id="different-task", backend_attested=True
        )
        self.assertFalse(decision.allowed)
        self.assertIn("task_binding_mismatch", decision.reasons)
        self.assertIn("owner_policy_not_accepted", decision.reasons)

    def test_host_credentials_and_privilege_are_forbidden(self):
        decision = validate_sandbox_policy(
            approved(host_credentials_access=True, privileged_mode=True),
            task_id="task-123", backend_attested=True,
        )
        self.assertFalse(decision.allowed)
        self.assertIn("host_credentials_access_forbidden", decision.reasons)
        self.assertIn("privileged_mode_forbidden", decision.reasons)

    def test_path_traversal_is_denied(self):
        decision = validate_sandbox_policy(
            approved(allowed_write_paths=frozenset({"../outside"})),
            task_id="task-123", backend_attested=True,
        )
        self.assertFalse(decision.allowed)
        self.assertIn("unsafe_write_path", decision.reasons)

    def test_least_privilege_resource_paths_are_enforced(self):
        decision = validate_sandbox_policy(
            approved(), task_id="task-123",
            required_write_paths=frozenset({"out", "secrets"}),
            backend_attested=True,
        )
        self.assertFalse(decision.allowed)
        self.assertIn("required_write_path_not_granted", decision.reasons)

    def test_network_egress_requires_explicit_allowlist_and_network_flag(self):
        policy = approved(allowed_egress_hosts=frozenset({"api.example.test"}))
        decision = validate_sandbox_policy(
            policy, task_id="task-123",
            required_egress_hosts=frozenset({"api.example.test"}),
            backend_attested=True,
        )
        self.assertFalse(decision.allowed)
        self.assertIn("egress_requested_while_network_disabled", decision.reasons)
        self.assertIn("egress_hosts_configured_while_network_disabled", decision.reasons)

    def test_required_environment_and_egress_must_be_granted(self):
        decision = validate_sandbox_policy(
            approved(), task_id="task-123",
            required_environment=frozenset({"TOKEN"}),
            required_egress_hosts=frozenset({"api.example.test"}),
            backend_attested=True,
        )
        self.assertFalse(decision.allowed)
        self.assertIn("environment_allowlist_mismatch", decision.reasons)
        self.assertIn("egress_allowlist_mismatch", decision.reasons)

    def test_resource_ceilings_are_enforced(self):
        decision = validate_sandbox_policy(
            approved(memory_mb=4096, wall_seconds=500),
            task_id="task-123", backend_attested=True,
        )
        self.assertFalse(decision.allowed)
        self.assertIn("memory_limit_out_of_bounds", decision.reasons)
        self.assertIn("wall_time_limit_out_of_bounds", decision.reasons)


    def test_credential_like_environment_names_are_forbidden(self):
        policy = approved(allowed_environment=frozenset({"LANG", "GITHUB_TOKEN"}))
        decision = validate_sandbox_policy(
            policy, task_id="task-123", backend_attested=True
        )
        self.assertFalse(decision.allowed)
        self.assertIn("credential_environment_forbidden", decision.reasons)

    def test_workspace_root_traversal_is_denied(self):
        policy = approved(workspace_root="/srv/worker/../host")
        decision = validate_sandbox_policy(
            policy, task_id="task-123", backend_attested=True
        )
        self.assertFalse(decision.allowed)
        self.assertIn("workspace_root_invalid", decision.reasons)

    def test_malformed_path_segments_and_egress_urls_fail_closed(self):
        for path in ("src/./main.py", "src//main.py", "src/../outside", "/absolute", "src\\\\main.py"):
            with self.subTest(path=path):
                decision = validate_sandbox_policy(
                    approved(allowed_read_paths=frozenset({path})),
                    task_id="task-123", backend_attested=True,
                )
                self.assertFalse(decision.allowed)
                self.assertIn("unsafe_read_path", decision.reasons)
        for host in ("https://api.example.test", "api.example.test:443", "*.example.test", "API.example.test", "localhost"):
            with self.subTest(host=host):
                decision = validate_sandbox_policy(
                    approved(network_enabled=True, allowed_egress_hosts=frozenset({host})),
                    task_id="task-123", required_egress_hosts=frozenset({host}),
                    backend_attested=True,
                )
                self.assertFalse(decision.allowed)
                self.assertIn("egress_host_invalid", decision.reasons)

    def test_malformed_allowlists_and_bool_resource_limits_fail_closed(self):
        decision = validate_sandbox_policy(
            approved(allowed_write_paths=["out"]), task_id="task-123", backend_attested=True
        )
        self.assertFalse(decision.allowed)
        self.assertIn("write_allowlist_invalid", decision.reasons)
        decision = validate_sandbox_policy(
            approved(cpu_seconds=True), task_id="task-123", backend_attested=True
        )
        self.assertFalse(decision.allowed)
        self.assertIn("cpu_limit_out_of_bounds", decision.reasons)

    def test_decision_cannot_be_replayed_after_same_version_policy_mutation(self):
        policy = approved()
        decision = validate_sandbox_policy(policy, task_id="task-123", backend_attested=True)
        changed = approved(allowed_write_paths=frozenset({"out", "extra-output"}))
        with self.assertRaisesRegex(PermissionError, "changed after authorization"):
            build_launch_plan(changed, decision)

    def test_denied_decision_cannot_create_launch_plan(self):
        policy = approved()
        decision = validate_sandbox_policy(policy, task_id="wrong", backend_attested=True)
        with self.assertRaises(PermissionError):
            build_launch_plan(policy, decision)

    def test_decision_cannot_be_replayed_against_another_policy(self):
        policy = approved()
        decision = validate_sandbox_policy(policy, task_id="task-123", backend_attested=True)
        changed = approved(policy_version="trinity-sandbox-v2")
        with self.assertRaises(PermissionError):
            build_launch_plan(changed, decision)


if __name__ == "__main__":
    unittest.main()
