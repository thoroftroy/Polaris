package dev.wonderdesk.polaris

import kotlin.math.*

/** Solves typed arithmetic such as "12*(3+4)", "sqrt(2)^3", "15% of 80" or "2^10" so a search can answer it right away. */
object MathAnswer {
    /** The answer as text, or null when the input isn't a calculation. */
    fun of(input: String): String? {
        val s = input.trim().lowercase().removeSuffix("=").trim()
        if (s.length < 3 || s.none { it.isDigit() }) return null
        // Needs an operator or a function, or it's just a number.
        if (!Regex("[-+*/^×÷%!]|\\b(sqrt|sin|cos|tan|ln|log|abs|pi|e)\\b|\\(").containsMatchIn(s.drop(1))) return null
        if (s.contains("://") || s.contains(".com")) return null
        val t = s.replace("×", "*").replace("÷", "/").replace("**", "^").replace(Regex("(\\d)\\s*%\\s*of\\s*"), "$1/100*").replace("x", "*")
            .replace(Regex("(?<=\\d)\\s*%"), "/100")
        return runCatching { P(t).run() }.getOrNull()?.takeIf { it.isFinite() }?.let { fmt(it) }
    }

    private fun fmt(v: Double): String {
        if (v == v.roundToLong().toDouble() && abs(v) < 1e15) return v.roundToLong().toString()
        return java.math.BigDecimal(v).round(java.math.MathContext(12)).stripTrailingZeros().toPlainString()
    }

    private class P(val s: String) {
        var i = 0
        fun run(): Double { val v = expr(); ws(); if (i != s.length) error("junk"); return v }
        fun ws() { while (i < s.length && s[i] == ' ') i++ }
        fun eat(c: Char): Boolean { ws(); return if (i < s.length && s[i] == c) { i++; true } else false }
        fun expr(): Double { var v = term(); while (true) { v = when { eat('+') -> v + term(); eat('-') -> v - term(); else -> return v } } }
        fun term(): Double { var v = power(); while (true) { v = when { eat('*') -> v * power(); eat('/') -> v / power(); else -> return v } } }
        fun power(): Double { val b = unary(); return if (eat('^')) b.pow(power()) else b }
        fun unary(): Double = if (eat('-')) -unary() else if (eat('+')) unary() else postfix()
        fun postfix(): Double {
            var v = atom()
            while (eat('!')) { var r = 1.0; for (k in 2..v.toInt().coerceIn(0, 170)) r *= k; v = r }
            return v
        }
        fun atom(): Double {
            ws()
            if (eat('(')) { val v = expr(); if (!eat(')')) error("paren"); return v }
            val st = i
            if (i < s.length && (s[i].isDigit() || s[i] == '.')) { while (i < s.length && (s[i].isDigit() || s[i] == '.')) i++; return s.substring(st, i).toDouble() }
            while (i < s.length && s[i].isLetter()) i++
            val name = s.substring(st, i)
            when (name) { "pi" -> return PI; "e" -> return E }
            if (!eat('(')) error("fn"); val a = expr(); if (!eat(')')) error("paren")
            return when (name) { "sqrt" -> sqrt(a); "sin" -> sin(a); "cos" -> cos(a); "tan" -> tan(a); "ln" -> ln(a); "log" -> log10(a); "abs" -> abs(a); else -> error("fn") }
        }
    }
}
