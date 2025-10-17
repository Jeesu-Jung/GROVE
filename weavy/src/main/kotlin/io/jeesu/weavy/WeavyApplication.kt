package io.jeesu.weavy

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class WeavyApplication

fun main(args: Array<String>) {
    runApplication<WeavyApplication>(*args)
}
