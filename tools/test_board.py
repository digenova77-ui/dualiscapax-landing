import json, os, subprocess, sys, tempfile, unittest
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import board

class T(unittest.TestCase):
    def setUp(self):
        self.d = tempfile.mkdtemp(); self.f = os.path.join(self.d, "b.jsonl")
        board.append(self.f, "genesis", "g", [], "2026-10-17T00:00:00Z")
        board.append(self.f, "a", "x", ["PR#1"], "2026-10-17T00:00:01Z")
        board.append(self.f, "b", "y", ["PR#2"], "2026-10-17T00:00:02Z")
    def lines(self): return board.read(self.f).splitlines()
    def write(self, ls):
        with open(self.f, "w") as fh: fh.write("\n".join(ls) + "\n")
    def test_chain_ok(self):
        ok, n, _ = board.verify_text(board.read(self.f)); self.assertTrue(ok); self.assertEqual(n, 3)
        self.assertEqual(json.loads(self.lines()[0])["prev_hash"], "0" * 64)
    def test_deterministic(self):
        f2 = os.path.join(self.d, "c.jsonl")
        board.append(f2, "genesis", "g", [], "2026-10-17T00:00:00Z")
        self.assertEqual(board.read(f2).splitlines()[0], self.lines()[0])
    def test_edit_detected(self):
        ls = self.lines(); e = json.loads(ls[1]); e["action"] = "z"; ls[1] = board.serialize(e).strip(); self.write(ls)
        ok, _, msg = board.verify_text(board.read(self.f)); self.assertFalse(ok); self.assertIn("line 2", msg)
    def test_rehash_detected_downstream(self):
        ls = self.lines(); e = json.loads(ls[1]); e["action"] = "z"; e["hash"] = board.entry_hash(e)
        ls[1] = board.serialize(e).strip(); self.write(ls)
        ok, _, msg = board.verify_text(board.read(self.f)); self.assertFalse(ok); self.assertIn("line 3", msg)
    def test_delete_and_reorder(self):
        ls = self.lines(); self.write([ls[0], ls[2]]); self.assertFalse(board.verify_text(board.read(self.f))[0])
        self.write([ls[0], ls[2], ls[1]]); self.assertFalse(board.verify_text(board.read(self.f))[0])
    def test_append_refuses_broken(self):
        ls = self.lines(); self.write(ls[:1] + ["{bad"])
        with self.assertRaises(ValueError): board.append(self.f, "c", "z", [])
    def test_append_only(self):
        old = board.read(self.f); board.append(self.f, "c", "z", [])
        self.assertTrue(board.verify_append_only(old, board.read(self.f))[0])
        self.assertFalse(board.verify_append_only(old + "x", board.read(self.f))[0])
    def test_cli_and_repo_board(self):
        r = subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), "board.py"), "verify"], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout)

if __name__ == "__main__": unittest.main()
