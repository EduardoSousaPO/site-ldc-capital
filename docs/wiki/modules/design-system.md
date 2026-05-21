# Design System — LDC Capital

## Identidade Visual

LDC Capital (CVM 3976-4) é uma gestora de patrimônio UHNW. O visual é sóbrio, premium e intencional: fundo claro ou escuro, tipografia serif editorial, acento verde-oliva.

---

## Cores

### Paleta Principal (CSS vars em `globals.css` + tokens Tailwind em `globals.css @theme`)

| Token Tailwind | CSS Var | Hex | Uso |
|---|---|---|---|
| `ldc-primary` | `--color-ldc-primary` | `#262d3d` | Azul-marinho escuro — cor principal, fundos dark, texto em fundo claro |
| `ldc-accent-1` | `--color-ldc-accent-1` | `#98ab44` | Verde-oliva — CTA primário, destaques, ring de foco |
| `ldc-accent-2` | `--color-ldc-accent-2` | `#becc6a` | Verde claro — hover, gradientes, acento secundário |
| `ldc-gray-light` | `--color-ldc-gray-light` | `#e3e3e3` | Cinza claro — bordas, inputs, fundos secundários |
| `ldc-neutral-dark` | `--color-ldc-neutral-dark` | `#344645` | Verde-escuro neutro — cards em dark mode |
| `ldc-neutral-medium` | `--color-ldc-neutral-medium` | `#577171` | Verde-acinzentado — texto secundário, muted |

### Como usar no Tailwind

```tsx
// Fundo principal
<div className="bg-ldc-primary text-white" />

// Botão CTA
<button className="bg-ldc-accent-1 hover:bg-ldc-accent-2 text-white" />

// Texto muted
<p className="text-ldc-neutral-medium" />
```

### Tokens shadcn/ui (mapeados na `:root`)

| Token | Light | Dark |
|---|---|---|
| `--primary` | `#98ab44` | `#98ab44` |
| `--primary-foreground` | `#ffffff` | `#262d3d` |
| `--accent` | `#becc6a` | `#becc6a` |
| `--background` | `#ffffff` | `#262d3d` |
| `--foreground` | `#262d3d` | `#ffffff` |
| `--muted` | `#e3e3e3` | `#577171` |
| `--muted-foreground` | `#577171` | `#e3e3e3` |
| `--border` | `#e3e3e3` | `#577171` |

### Gradientes

```css
/* Gradiente premium (animado) */
.gradient-premium {
  background: linear-gradient(135deg, #98ab44 0%, #becc6a 50%, #98ab44 100%);
}

/* Texto com gradiente */
.text-gradient-ldc {
  background: linear-gradient(135deg, #98ab44, #becc6a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## Tipografia

### Fontes

| Fonte | Tipo | Uso | Arquivos |
|---|---|---|---|
| **IvyMode** | Serif editorial | Títulos (h1–h6), headlines de impacto | `public/fonts/ivymode/IvyMode-*.otf` |
| **Public Sans** | Sans-serif legível | Corpo de texto, UI, labels, parágrafos | `public/fonts/ivymode/PublicSans-*.ttf` |

### Variantes disponíveis — IvyMode

- Thin / Thin Italic
- Light / Light Italic
- Regular / Italic
- SemiBold / SemiBold Italic
- Bold / Bold Italic
- Variable Font (VF Thin)

### Variantes disponíveis — Public Sans

- Thin / ExtraLight / Light / Regular / Medium / SemiBold / Bold / ExtraBold / Black
- Todas com variante Italic

### Hierarquia tipográfica (definida em `globals.css`)

| Elemento | Classes Tailwind | Descrição |
|---|---|---|
| `h1` | `font-serif text-3xl→7xl font-bold tracking-tight` | Hero headlines |
| `h2` | `font-serif text-2xl→6xl font-semibold` | Seções principais |
| `h3` | `font-serif text-xl→4xl font-semibold` | Subseções |
| `p` | `font-sans text-sm→xl leading-relaxed` | Corpo de texto |

**Regra:** todos os `h1`–`h6` usam `font-serif` (IvyMode) com `letter-spacing: -0.025em`. Todo texto de UI usa `font-sans` (Public Sans).

### Como usar

```tsx
// Título editorial
<h1 className="font-serif font-bold tracking-tight">LDC Capital</h1>

// Texto de UI
<p className="font-sans text-ldc-neutral-medium">Gestão de patrimônio</p>

// Destaque com gradiente
<span className="text-gradient-ldc font-serif font-bold">Excelência</span>
```

---

## Espaçamento e Layout

### Border Radius

| Token | Valor calculado | Uso |
|---|---|---|
| `rounded-sm` | `calc(1rem - 4px)` = 12px | Badges, tags pequenas |
| `rounded-md` | `calc(1rem - 2px)` = 14px | Inputs, botões |
| `rounded-lg` | `1rem` = 16px | Cards padrão |
| `rounded-xl` | `calc(1rem + 4px)` = 20px | Cards grandes, modais |

### Container

```css
/* xl: max 1280px */
/* 2xl: max 1536px */
/* ultra-wide: max 1800px */
```

### Seções de página

Padrão: `py-16 md:py-24 lg:py-32` para seções principais.

---

## Animações

Definidas em `globals.css` como classes utilitárias:

| Classe | Efeito | Duração |
|---|---|---|
| `.animate-fade-in` | Surge com translateY(20px→0) | 0.8s |
| `.animate-slide-up` | Sobe com translateY(30px→0) | 0.8s |
| `.animate-slide-in-left` | Entra da esquerda | 0.8s |
| `.animate-slide-in-right` | Entra da direita | 0.8s |
| `.animate-float` | Flutua suavemente (loop) | 3s |
| `.animate-glow` | Pulsa sombra verde (loop) | 2s |
| `.gradient-premium` | Gradiente animado (loop) | 3s |

### Delays escalonados

```tsx
<div className="animate-fade-in delay-200" />  // 0.2s
<div className="animate-fade-in delay-300" />  // 0.3s
<div className="animate-fade-in delay-500" />  // 0.5s
<div className="animate-fade-in delay-700" />  // 0.7s
<div className="animate-fade-in delay-1000" /> // 1.0s
```

---

## Efeitos de Componente

### Card Premium

```tsx
<div className="card-premium rounded-xl border border-ldc-gray-light p-6">
  {/* hover eleva 8px + sombra verde suave */}
</div>
```

### Glass Effect

```tsx
<div className="glass-effect rounded-xl p-6">
  {/* fundo semi-transparente com blur — usar sobre fundos escuros */}
</div>
```

### Scrollbar personalizada

Automático via CSS — thumb verde-oliva (`#98ab44`), track cinza claro.

---

## Focus e Acessibilidade

Ring de foco: `outline-2 outline-[#98ab44] outline-offset-2` — aplicado globalmente em `*:focus-visible`.

---

## Componentes shadcn/ui disponíveis

`Button`, `Input`, `Label`, `Card`, `Badge`, `Checkbox`, `Textarea`, `Tooltip`, `Tabs`, `Select`, `AlertDialog`, `Carousel`, `Toast`

Configurados em `components.json` com style `default` e base color mapeada para a paleta LDC.
