package io.jeesu.weavy.infrastucture.config

import com.github.benmanes.caffeine.cache.Caffeine
import dev.langchain4j.memory.ChatMemory
import dev.langchain4j.memory.chat.ChatMemoryProvider
import dev.langchain4j.memory.chat.MessageWindowChatMemory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.time.Duration

@Configuration
class ChatMemoryConfig(
    @Value("\${chat.memory.windowSize:10}") private val windowSize: Int,
    @Value("\${chat.memory.ttlMinutes:30}") private val ttlMinutes: Long,
    @Value("\${chat.memory.maxSessions:10000}") private val maxSessions: Long
) {

    @Bean
    fun chatMemoryProvider(): ChatMemoryProvider {
        val cache = Caffeine.newBuilder()
            .maximumSize(maxSessions)
            .expireAfterAccess(Duration.ofMinutes(ttlMinutes))
            .build<String, ChatMemory>()

        return ChatMemoryProvider { memoryId ->
            val id = memoryId?.toString() ?: "default"
            val existing = cache.getIfPresent(id)
            if (existing != null) {
                existing
            } else {
                val created = MessageWindowChatMemory.withMaxMessages(windowSize)
                cache.put(id, created)
                created
            }
        }
    }
}
