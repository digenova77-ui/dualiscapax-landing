using System;
using System.Security.Cryptography;
using System.Text;
using UnityEngine;

public static class LawFloor
{
    public static readonly string[] Axioms = { "NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST", "TRUTH_OR_NOTHING" };

    public static string Hole(string why)
    {
        var body = "{\"verdict\":\"HOLE\",\"authority\":\"NONE\",\"pii\":0,\"why\":\"" + why + "\"}";
        using var sha = SHA256.Create();
        var hash = sha.ComputeHash(Encoding.UTF8.GetBytes(body));
        return BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
    }
}

public class ManifoldPlayground : MonoBehaviour
{
    public string origin = "http://127.0.0.1:8080";

    void Start()
    {
        for (int i = 1; i <= 6; i++)
        {
            var ring = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            ring.name = "L" + i;
            ring.transform.localScale = new Vector3(i * 1.4f, 0.02f, i * 1.4f);
        }
        var dclm = GameObject.CreatePrimitive(PrimitiveType.Cube);
        dclm.name = "DCLM";
        dclm.transform.position = new Vector3(-3f, 2f, 0f);
        dclm.transform.localScale = new Vector3(1.2f, 4f, 1.2f);
        var iris = GameObject.CreatePrimitive(PrimitiveType.Cube);
        iris.name = "IRIS";
        iris.transform.position = new Vector3(3f, 2f, 0f);
        iris.transform.localScale = new Vector3(1.2f, 4f, 1.2f);
        Debug.Log("Unity playground parented. Jacket origin " + origin + ". Authority NONE.");
    }
}
