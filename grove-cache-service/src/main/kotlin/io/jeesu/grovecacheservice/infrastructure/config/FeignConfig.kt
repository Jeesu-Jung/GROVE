package io.jeesu.grovecacheservice.infrastructure.config

import feign.Logger
import feign.Request
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class FeignConfig {
    @Bean
    fun feignOptions(): Request.Options = Request.Options(15_000, 15_000)

    @Bean
    fun feignLoggerLevel(): Logger.Level = Logger.Level.BASIC
}
