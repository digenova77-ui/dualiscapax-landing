using System;
using System.Security.Cryptography;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

public static class LawFloor
{
    public static readonly string[] Axioms = { "NO_FORCE", "HOST_SAFE", "CLEANUP_FIRST", "TRUTH_OR_NOTHING" };

    public static string Hole(string why)
    {
        var body = "{\"verdict\":\"HOLE\",\"authority\":\"NONE\",\"pii\":0,\"why\":\"" + EscapeJson(why) + "\"}";
        using var sha = SHA256.Create();
        var hash = sha.ComputeHash(Encoding.UTF8.GetBytes(body));
        return BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
    }

    private static string EscapeJson(string value)
    {
        if (value == null) return "";
        var builder = new StringBuilder(value.Length);
        foreach (var c in value)
        {
            switch (c)
            {
                case '\\': builder.Append("\\\\"); break;
                case '"': builder.Append("\\\""); break;
                case '\n': builder.Append("\\n"); break;
                case '\r': builder.Append("\\r"); break;
                case '\t': builder.Append("\\t"); break;
                default: builder.Append(c); break;
            }
        }
        return builder.ToString();
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
        StartCoroutine(PipeSceneReceipt());
    }

    private System.Collections.IEnumerator PipeSceneReceipt()
    {
        var json = "{\"source\":\"unity\",\"payload\":{\"kind\":\"scene-manifold\",\"rings\":6,\"towers\":[\"DCLM\",\"IRIS\"],\"authority\":\"NONE\",\"pii_coefficient\":0}}";
        using var request = new UnityWebRequest(origin + "/v2/dclm/ingest", "POST");
        request.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(json));
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");
        yield return request.SendWebRequest();
        if (request.result == UnityWebRequest.Result.Success)
            Debug.Log("DCLM ingress receipt: " + request.downloadHandler.text);
        else
            Debug.Log("DCLM ingress HOLE: " + request.error);
    }
}
