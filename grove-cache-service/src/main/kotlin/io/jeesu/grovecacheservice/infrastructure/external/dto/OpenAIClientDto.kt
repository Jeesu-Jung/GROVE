package io.jeesu.grovecacheservice.infrastructure.external.dto

import com.fasterxml.jackson.annotation.JsonInclude

class OpenAIClientDto {
    @JsonInclude(JsonInclude.Include.NON_NULL)
    data class Request(
        val model: String,
        val input: String,
        val instructions: String? = null,
        val max_output_tokens: Int? = null
    )

    data class OutputText(val type: String, val text: String)
    data class OutputContent(val type: String, val role: String? = null, val content: List<OutputText>? = null)
    data class Response(val output: List<OutputContent>)
}
