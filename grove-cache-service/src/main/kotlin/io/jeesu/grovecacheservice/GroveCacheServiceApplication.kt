package io.jeesu.grovecacheservice

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.cloud.openfeign.EnableFeignClients

@SpringBootApplication
@EnableFeignClients
class GroveCacheServiceApplication

fun main(args: Array<String>) {
    runApplication<GroveCacheServiceApplication>(*args)
}
