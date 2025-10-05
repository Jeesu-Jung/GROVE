package io.jeesu.grovecacheservice.infrastructure.external.client

import io.jeesu.grovecacheservice.infrastructure.external.dto.AnthropicClientDto
import org.springframework.cloud.openfeign.FeignClient
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader

@FeignClient(name = "anthropic", url = "https://api.anthropic.com", configuration = [])
interface AnthropicClient {
    @PostMapping("/v1/messages")
    fun messages(
        @RequestHeader("x-api-key") apiKey: String,
        @RequestHeader("anthropic-version") version: String = "2023-06-01",
        @RequestBody body: AnthropicClientDto.Request
    ): AnthropicClientDto.Response
}
