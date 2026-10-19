package com.tripmate.mobile

import org.json.JSONArray
import org.json.JSONObject
import org.json.JSONTokener
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

object TripMateApi {
    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()
    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    @Volatile
    var baseUrl: String = BuildConfig.API_BASE_URL

    @Volatile
    var token: String? = null

    fun request(method: String, path: String, payload: JSONObject? = null): Any? {
        val normalizedBase = baseUrl.trim().trimEnd('/')
        require(normalizedBase.startsWith("https://") || normalizedBase.startsWith("http://")) {
            "API address must start with https:// or http://"
        }
        val requestBody = when {
            payload != null -> payload.toString().toRequestBody(jsonMediaType)
            method in setOf("POST", "PUT", "PATCH") -> JSONObject().toString().toRequestBody(jsonMediaType)
            else -> null
        }
        val requestBuilder = Request.Builder()
            .url("$normalizedBase/${path.trimStart('/')}")
            .header("Accept", "application/json")
            .method(method, requestBody)
        token?.let { requestBuilder.header("Authorization", "Bearer $it") }

        httpClient.newCall(requestBuilder.build()).execute().use { response ->
            val responseText = response.body?.string().orEmpty()
            if (!response.isSuccessful) {
                val message = try {
                    JSONObject(responseText).optString("error").ifBlank { "Request failed (${response.code})." }
                } catch (_: Exception) {
                    "Request failed (${response.code})."
                }
                throw ApiException(response.code, message)
            }
            if (responseText.isBlank()) return null
            return JSONTokener(responseText).nextValue()
        }
    }

    fun objectRequest(method: String, path: String, payload: JSONObject? = null): JSONObject {
        return request(method, path, payload) as? JSONObject
            ?: throw IllegalStateException("The API returned an unexpected response.")
    }

    fun arrayRequest(path: String): JSONArray {
        return request("GET", path) as? JSONArray
            ?: throw IllegalStateException("The API returned an unexpected response.")
    }
}

class ApiException(val status: Int, message: String) : Exception(message)
