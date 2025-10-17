package io.jeesu.weavy.infrastucture.config

import dev.langchain4j.data.segment.TextSegment
import dev.langchain4j.store.embedding.EmbeddingStore
import dev.langchain4j.store.embedding.milvus.MilvusEmbeddingStore
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class MilvusConfig(
    @Value("\${milvus.uri}") private val uri: String,
    @Value("\${milvus.collection}") private val collection: String,
    @Value("\${milvus.dimension}") private val dimension: Int
) {

    @Bean
    fun embeddingStore(): EmbeddingStore<TextSegment> =
        MilvusEmbeddingStore.builder()
            .uri(uri)
            .collectionName(collection)
            .dimension(dimension)
            .build()
}
