"""Penerjemah ringkas notasi rumus -> MathML Presentation untuk perakit modul.
Sintaks: angka, huruf (mi), _x / _{...} subskrip, ^x / ^{...} superskrip, a/b pecahan (operan atom atau (grup)),
sqrt(...), exp ln log sebagai nama fungsi, * titik, - minus, ~ approx, <= >= != , "teks" mi multi-huruf, \\mu dst tidak perlu (pakai Unicode)."""
import re
FUNCS = {'exp', 'ln', 'log', 'sin', 'cos', 'erfc', 'min', 'max'}
OPS = {'=': '=', '+': '+', '-': '&#x2212;', '*': '&#xB7;', '~': '&#x2248;', '<': '&lt;', '>': '&gt;', ',': ',', ':': ':', '<=': '&#x2264;', '>=': '&#x2265;', '!=': '&#x2260;', '->': '&#x2192;', '=>': '&#x21D2;', '<->': '&#x21D4;', '|': '|', '+-': '&#xB1;'}

class P:
    def __init__(s, t): s.t, s.i = t, 0
    def ws(s):
        while s.i < len(s.t) and s.t[s.i] == ' ': s.i += 1
    def peek(s, n=1): s.ws(); return s.t[s.i:s.i + n]
    def seq(s, end=None):
        out = []
        while True:
            s.ws()
            if s.i >= len(s.t) or (end and s.t[s.i] == end): break
            out.append(s.item())
        return out
    def group(s):
        s.i += 1; inner = s.seq(')'); s.ws(); s.i += 1
        return inner
    def atom(s):
        s.ws(); c = s.t[s.i]
        if c == '(':
            return ('group', s.group())
        if c == '{':
            s.i += 1; inner = s.seq('}'); s.i += 1; return ('group', inner)
        m = re.compile(r'\d+(?:[.,]\d+)?').match(s.t, s.i)
        if m: s.i = m.end(); return ('x', '<mn>%s</mn>' % m.group(0))
        if c == '"':
            j = s.t.index('"', s.i + 1); w = s.t[s.i + 1:j]; s.i = j + 1; return ('x', '<mi>%s</mi>' % w)
        m = re.compile(r'[A-Za-z]+').match(s.t, s.i)
        if m and m.group(0) in FUNCS: s.i = m.end(); return ('x', '<mi>%s</mi>' % m.group(0))
        if m and m.group(0) == 'sqrt':
            s.i = m.end(); g = s.group(); return ('x', '<msqrt>%s</msqrt>' % ''.join(s.render(g)))
        if m and m.group(0) == 'space': s.i = m.end(); return ('x', '<mspace width="1em"/>')
        if c.isalpha(): s.i += 1; return ('x', '<mi>%s</mi>' % c)
        for op in ('<->', '->', '=>', '<=', '>=', '!=', '+-'):
            if s.t.startswith(op, s.i): s.i += len(op); return ('x', '<mo>%s</mo>' % OPS[op])
        s.i += 1; return ('x', '<mo>%s</mo>' % OPS.get(c, c))
    def script(s):
        s.i += 1; s.ws()
        if s.t[s.i] == '{':
            s.i += 1; inner = s.seq('}'); s.i += 1; return ''.join(s.render(inner))
        return s.render([s.atom()])[0]
    def scripted(s):
        a = s.atom(); base = a; sub = sup = None
        while s.i < len(s.t) and s.t[s.i] in '_^':
            if s.t[s.i] == '_': sub = s.script()
            else: sup = s.script()
        return a, sub, sup
    def build(s, a, sub, sup, paren=True):
        b = s.render([a], paren)[0]
        if sub and sup: return '<msubsup>%s%s%s</msubsup>' % (b, sub, sup)
        if sub: return '<msub>%s%s</msub>' % (b, sub)
        if sup: return '<msup>%s%s</msup>' % (b, sup)
        return b
    def item(s):
        a, sub, sup = s.scripted()
        s.ws()
        if s.i < len(s.t) and s.t[s.i] == '/':
            s.i += 1; s.ws(); a2, sub2, sup2 = s.scripted()
            return '<mfrac><mrow>%s</mrow><mrow>%s</mrow></mfrac>' % (s.build(a, sub, sup, False), s.build(a2, sub2, sup2, False))
        return s.build(a, sub, sup)
    def render(s, nodes, paren=True):
        out = []
        for n in nodes:
            if isinstance(n, str): out.append(n)
            elif n[0] == 'x': out.append(n[1])
            else:
                inner = ''.join(s.render(n[1]))
                out.append('<mrow><mo>(</mo>%s<mo>)</mo></mrow>' % inner if paren else '<mrow>%s</mrow>' % inner)
        return out

def mathml(expr):
    p = P(expr)
    return '<math display="block">%s</math>' % ''.join(p.render(p.seq()))

def eq(alt, expr):
    return '<div class="icd-eq">%s<span class="alt">%s</span></div>' % (mathml(expr), alt.replace('&', '&amp;').replace('<', '&lt;'))

def inline(expr):
    return mathml(expr).replace(' display="block"', '')

if __name__ == '__main__':
    print(eq('n', 'n = N_c exp(-(E_c - E_F)/(k T))'))
    print(eq('ni', 'n_i = sqrt(N_c N_v) exp(-E_g/(2 k T))'))
