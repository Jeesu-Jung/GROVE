package io.jeesu.weavy.infrastucture.config

import dev.langchain4j.model.chat.ChatModel
import dev.langchain4j.model.embedding.EmbeddingModel
import dev.langchain4j.model.openai.OpenAiChatModel
import dev.langchain4j.model.openai.OpenAiChatModelName.GPT_5
import dev.langchain4j.model.openai.OpenAiEmbeddingModel
import dev.langchain4j.model.openai.OpenAiEmbeddingModelName.TEXT_EMBEDDING_3_SMALL
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class OpenAIConfig(
    @Value("\${openai.api-key}") private val openaiApiKey: String,
) {
    @Bean
    fun embeddingModel(): EmbeddingModel {
        return OpenAiEmbeddingModel.builder()
            .apiKey(openaiApiKey)
            .modelName(TEXT_EMBEDDING_3_SMALL)
            .build()
    }

    @Bean
    fun chatModel(): ChatModel {
      return OpenAiChatModel.builder()
          .apiKey(openaiApiKey)
          .modelName(GPT_5)
          .build()
    }
}
