package io.jeesu.grovetaskmixtureservice

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.boot.context.properties.ConfigurationPropertiesScan

@SpringBootApplication
@ConfigurationPropertiesScan
class GroveTaskMixtureServiceApplication

fun main(args: Array<String>) {
	runApplication<GroveTaskMixtureServiceApplication>(*args)
}
