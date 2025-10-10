package io.jeesu.grovezebraservice.presentation.dto

import com.fasterxml.jackson.annotation.JsonInclude

@JsonInclude(JsonInclude.Include.NON_NULL)
data class Meta(
    val totalCount: Int? = null
)

@JsonInclude(JsonInclude.Include.NON_NULL)
data class ApiResponse<T>(
    val code: String,
    val message: String,
    val data: T? = null,
    val meta: Meta? = null
) {
    companion object {
        fun <T> success(
            data: T,
            message: String = "Success",
            code: String = "OK",
            meta: Meta? = null
        ): ApiResponse<T> = ApiResponse(code = code, message = message, data = data, meta = meta)

        fun error(message: String, code: String, meta: Meta? = null): ApiResponse<Nothing> =
            ApiResponse(code = code, message = message, data = null, meta = meta)
    }
}
