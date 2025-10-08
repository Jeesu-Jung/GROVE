package io.jeesu.grovetaskmixtureservice.infrastructure.config

import io.milvus.client.MilvusClient
import io.milvus.client.MilvusServiceClient
import io.milvus.param.ConnectParam
import jakarta.annotation.PreDestroy
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class MilvusConfig(
    private val properties: MilvusProperties
) {
    private var client: MilvusClient? = null

    @Bean
    fun milvusClient(): MilvusClient {
        if (client == null) {
            val connect = ConnectParam.newBuilder()
                .withHost(properties.host)
                .withPort(properties.port)
                .withDatabaseName(properties.database)
                .build()
            client = MilvusServiceClient(connect)
        }
        return client!!
    }

    @PreDestroy
    fun close() {
        client?.close()
    }
}

@Component
data class MilvusProperties(
    @Value("\${milvus.host:localhost}") val host: String,
    @Value("\${milvus.port:19530}") val port: Int,
    @Value("\${milvus.database:default}") val database: String,
    @Value("\${milvus.collection-name.seed-sentence:seed_sentence}") val seedSentenceCollection: String,
    @Value("\${milvus.collection-name.instruction-alpaca:instruction_alpaca}") val instructionCollection: String
)
