package io.jeesu.grovecacheservice.presentation.dto

import com.fasterxml.jackson.annotation.JsonInclude

class GPTDto {
    @JsonInclude(JsonInclude.Include.NON_NULL)
    data class ResponsesRequest(
        val model: String,
        val input: String,
        val instructions: String? = null,
        val max_output_tokens: Int? = null
    )
}
