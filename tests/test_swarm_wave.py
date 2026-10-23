import unittest
from swarm_wave import WorkCandidate, plan_wave

class WavePlannerTests(unittest.TestCase):
    def test_plans_within_budget_without_authorizing_execution(self):
        items = [WorkCandidate('task-b', 'scope', 2, 0, 1, 1), WorkCandidate('task-a', 'scope', 1, 0, 1, 1)]
        result = plan_wave(items, max_items=1, budget=1)
        self.assertEqual(result['status'], 'PLANNED')
        self.assertFalse(result['execution_authorized'])
        self.assertEqual(result['selected_count'], 1)
        self.assertLessEqual(result['estimated_cost_total'], result['budget'])

if __name__ == '__main__':
    unittest.main()
