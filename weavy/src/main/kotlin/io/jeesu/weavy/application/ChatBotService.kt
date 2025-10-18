package io.jeesu.weavy.application

import dev.langchain4j.data.document.Document
import dev.langchain4j.data.document.DocumentParser
import dev.langchain4j.data.document.DocumentSplitter
import dev.langchain4j.data.document.loader.FileSystemDocumentLoader.loadDocument
import dev.langchain4j.data.document.parser.TextDocumentParser
import dev.langchain4j.data.document.splitter.DocumentSplitters
import dev.langchain4j.data.embedding.Embedding
import dev.langchain4j.data.segment.TextSegment
import dev.langchain4j.memory.ChatMemory
import dev.langchain4j.memory.chat.MessageWindowChatMemory
import dev.langchain4j.model.chat.ChatModel
import dev.langchain4j.model.embedding.EmbeddingModel
import dev.langchain4j.rag.content.retriever.ContentRetriever
import dev.langchain4j.rag.content.retriever.EmbeddingStoreContentRetriever
import dev.langchain4j.service.AiServices
import dev.langchain4j.store.embedding.EmbeddingStore
import io.jeesu.weavy.domain.Assistant
import io.jeesu.weavy.infrastucture.util.Utils.toPath
import com.github.benmanes.caffeine.cache.Caffeine
import java.time.Duration
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

@Service
class ChatBotService(
    private val chatModel: ChatModel,
    private val embeddingModel: EmbeddingModel,
    private val embeddingStore: EmbeddingStore<TextSegment>,
    @Value("\${chat.memory.windowSize:10}") private val windowSize: Int,
    @Value("\${chat.memory.ttlMinutes:30}") private val ttlMinutes: Long,
    @Value("\${chat.memory.maxSessions:10000}") private val maxSessions: Long
) {
    private val assistantCache = Caffeine.newBuilder()
        .maximumSize(maxSessions)
        .expireAfterAccess(Duration.ofMinutes(ttlMinutes))
        .build<String, Assistant>()

    fun answer(query: String?, id: String): String {
        val assistant =
            assistantCache.get(id) { createAssistantWithMemory(MessageWindowChatMemory.withMaxMessages(windowSize)) }
        return assistant.answer(query)
    }

    private fun createAssistantWithMemory(chatMemory: ChatMemory): Assistant {
        val contentRetriever: ContentRetriever = EmbeddingStoreContentRetriever.builder()
            .embeddingStore(embeddingStore)
            .embeddingModel(embeddingModel)
            .maxResults(2)
            .minScore(0.5)
            .build()

        return AiServices.builder(Assistant::class.java)
            .chatModel(chatModel)
            .systemMessageProvider {
                "당신은 weave 사이트의 안내를 위한 챗봇이며, 당신의 이름은 weavy 입니다."
            }
            .contentRetriever(contentRetriever)
            .chatMemory(chatMemory)
            .build()
    }

    fun ingestDocument(): Int {
        val documentPath = "documents/weave-document.txt"
        val documentParser: DocumentParser = TextDocumentParser()
        val document: Document = loadDocument(toPath(documentPath), documentParser)

        val splitter: DocumentSplitter = DocumentSplitters.recursive(300, 0)
        val segments: List<TextSegment> = splitter.split(document)

        val embeddings: List<Embedding> = embeddingModel.embedAll(segments).content()
        embeddingStore.removeAll()
        embeddingStore.addAll(embeddings, segments)

        return segments.size
    }
}
