package io.jeesu.weavy.infrastucture.config

import java.time.Clock
import java.time.LocalDate
import java.time.ZoneId
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.servlet.HandlerInterceptor

@Component
class RateLimitInterceptor(
    @Value("\${ratelimit.perIp.daily:50}") private val dailyLimit: Int,
    @Value("\${ratelimit.timezone:Asia/Seoul}") private val timeZone: String
) : HandlerInterceptor {

    private val clock: Clock = Clock.systemDefaultZone()
    private val counterByIp: MutableMap<String, AtomicInteger> = ConcurrentHashMap()
    @Volatile private var currentDate: LocalDate = LocalDate.now(clock.withZone(ZoneId.of(timeZone)))

    override fun preHandle(request: HttpServletRequest, response: HttpServletResponse, handler: Any): Boolean {
        rotateIfNewDay()

        val clientIp = extractClientIp(request)
        val count = counterByIp.computeIfAbsent(clientIp) { AtomicInteger(0) }.incrementAndGet()

        if (count > dailyLimit) {
            response.status = HttpStatus.TOO_MANY_REQUESTS.value()
            response.setHeader("X-RateLimit-Limit", dailyLimit.toString())
            response.setHeader("X-RateLimit-Remaining", "0")
            response.writer.write("Rate limit exceeded. Try again after midnight ${timeZone} time.")
            return false
        }

        val remaining = (dailyLimit - count).coerceAtLeast(0)
        response.setHeader("X-RateLimit-Limit", dailyLimit.toString())
        response.setHeader("X-RateLimit-Remaining", remaining.toString())
        return true
    }

    private fun rotateIfNewDay() {
        val zone = ZoneId.of(timeZone)
        val today = LocalDate.now(clock.withZone(zone))
        if (today.isAfter(currentDate)) {
            synchronized(this) {
                if (today.isAfter(currentDate)) {
                    counterByIp.clear()
                    currentDate = today
                }
            }
        }
    }

    private fun extractClientIp(request: HttpServletRequest): String {
        val headers = listOf(
            "X-Forwarded-For",
            "X-Real-IP",
            "CF-Connecting-IP",
            "True-Client-IP"
        )
        for (h in headers) {
            val v = request.getHeader(h)
            if (!v.isNullOrBlank()) {
                // X-Forwarded-For can contain a list: client, proxy1, proxy2
                return v.split(',')[0].trim()
            }
        }
        return request.remoteAddr ?: "unknown"
    }
}
