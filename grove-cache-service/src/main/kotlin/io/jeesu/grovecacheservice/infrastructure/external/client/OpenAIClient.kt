package io.jeesu.grovecacheservice.infrastructure.external.client

import io.jeesu.grovecacheservice.infrastructure.external.dto.OpenAIClientDto
import org.springframework.cloud.openfeign.FeignClient
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader

@FeignClient(name = "openai", url = "https://api.openai.com", configuration = [])
interface OpenAIClient {
    @PostMapping("/v1/chat/completions")
    fun chatCompletions(
        @RequestHeader("Authorization") authorization: String,
        @RequestBody body: OpenAIClientDto.Request
    ): OpenAIClientDto.Response
}
