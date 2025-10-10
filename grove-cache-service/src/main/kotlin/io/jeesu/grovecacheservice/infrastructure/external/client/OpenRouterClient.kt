package io.jeesu.grovecacheservice.infrastructure.external.client

import io.jeesu.grovecacheservice.infrastructure.external.dto.OpenRouterClientDto
import org.springframework.cloud.openfeign.FeignClient
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader

@FeignClient(name = "openrouter", url = "https://openrouter.ai", configuration = [])
interface OpenRouterClient {
    @PostMapping("/api/v1/chat/completions")
    fun chatCompletions(
        @RequestHeader("Authorization") authorization: String,
        @RequestBody body: OpenRouterClientDto.Request
    ): OpenRouterClientDto.Response
}


