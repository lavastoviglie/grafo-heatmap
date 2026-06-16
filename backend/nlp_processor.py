import spacy
import numpy as np
from collections import Counter, defaultdict
from sklearn.feature_extraction.text import TfidfVectorizer

nlp = spacy.load("it_core_news_sm")

STOP_WORDS = nlp.Defaults.stop_words
ALLOWED_POS = {"ADJ", "NOUN", "PROPN", "VERB"}

ALLOWED_PAIR_POS = {
    ("ADJ", "ADJ"), ("NOUN", "NOUN"), ("VERB", "VERB"),
    ("ADJ", "NOUN"), ("NOUN", "ADJ"),
}

def _lcp_len(a, b):
    i = 0
    while i < len(a) and i < len(b) and a[i] == b[i]:
        i += 1
    return i

def words_related(w1, w2):
    if len(w1) > len(w2):
        w1, w2 = w2, w1
    min_len = len(w1)
    lcp = _lcp_len(w1, w2)
    return min_len > 0 and lcp / min_len >= 0.7

def compute_word_groups(words, pos_map):
    if len(words) < 2:
        return {}, {}
    adj = {w: set() for w in words}
    for i, w1 in enumerate(words):
        p1 = pos_map.get(w1, "NOUN")
        if p1 == "PROPN":
            continue
        for j, w2 in enumerate(words):
            if i >= j:
                continue
            p2 = pos_map.get(w2, "NOUN")
            if p2 == "PROPN":
                continue
            if (p1, p2) not in ALLOWED_PAIR_POS:
                continue
            if words_related(w1, w2):
                adj[w1].add(w2)
                adj[w2].add(w1)
    visited = set()
    components = []
    for w in words:
        if w not in visited:
            comp = set()
            stack = [w]
            while stack:
                n = stack.pop()
                if n not in visited:
                    visited.add(n)
                    comp.add(n)
                    stack.extend(adj[n] - visited)
            if len(comp) >= 2:
                components.append(comp)
    word_to_group = {}
    groups = {}
    for gid, comp in enumerate(components):
        clist = list(comp)
        centroid = clist[0]
        max_score = -1
        for w in clist:
            others = [v for v in clist if v != w]
            if not others:
                continue
            score = sum(1 for v in others if words_related(w, v))
            if score > max_score:
                max_score = score
                centroid = w
        groups[str(gid)] = {"words": clist, "centroid_word": centroid}
        for w in clist:
            word_to_group[w] = str(gid)
    return word_to_group, groups

def process_text(text: str, window_size: int = 5, chunk_size: int = 80, chunk_step: int = 40, top_k_concepts: int = 20, min_freq: int = 2):
    doc = nlp(text)

    # First pass: collect lemmas and their sentences with offsets
    lemma_sentences = defaultdict(dict)
    lemma_surface_forms = defaultdict(set)
    lemma_pos = defaultdict(Counter)
    all_tokens_info = []

    for token in doc:
        if token.is_space or token.is_punct:
            continue
        lemma = token.lemma_.strip()
        if " " in lemma or lemma in STOP_WORDS or len(lemma) <= 2:
            continue
        if token.pos_ not in ALLOWED_POS:
            continue
        lemma_lower = lemma.lower()
        lemma_pos[lemma_lower][token.pos_] += 1
        lemma_surface_forms[lemma_lower].add(token.text.lower())
        sent = token.sent
        sent_text = sent.text.strip()
        if sent_text not in lemma_sentences[lemma_lower]:
            lemma_sentences[lemma_lower][sent_text] = (sent.start_char, sent.end_char)
        all_tokens_info.append(lemma_lower)

    # Fallback: if too few tokens, relax POS filter
    if len(all_tokens_info) < 10:
        lemma_sentences = defaultdict(dict)
        lemma_surface_forms = defaultdict(set)
        lemma_pos = defaultdict(Counter)
        all_tokens_info = []
        for token in doc:
            if token.is_space or token.is_punct:
                continue
            lemma = token.lemma_.strip()
            if " " in lemma or lemma in STOP_WORDS or len(lemma) <= 2:
                continue
            lemma_lower = lemma.lower()
            lemma_pos[lemma_lower][token.pos_] += 1
            lemma_surface_forms[lemma_lower].add(token.text.lower())
            sent = token.sent
            sent_text = sent.text.strip()
            if sent_text not in lemma_sentences[lemma_lower]:
                lemma_sentences[lemma_lower][sent_text] = (sent.start_char, sent.end_char)
            all_tokens_info.append(lemma_lower)

    freq = Counter(all_tokens_info)
    lemmi_frequenti = {w for w, c in freq.items() if c >= min_freq}
    tokens = [t for t in all_tokens_info if t in lemmi_frequenti]

    if not tokens:
        return {"nodes": [], "edges": [], "heatmap": {"chunks": [], "concepts": [], "matrix": []}, "word_sentences": {}, "word_forms": {}, "original_text": text, "word_to_group": {}, "word_groups": {}}

    word_freq = Counter(tokens)
    unique_words = list(word_freq.keys())

    cooccur = defaultdict(int)
    for i in range(len(tokens)):
        for j in range(i + 1, min(i + window_size, len(tokens))):
            w1, w2 = tokens[i], tokens[j]
            if w1 != w2:
                pair = tuple(sorted((w1, w2)))
                cooccur[pair] += 1

    max_cooccur = max(cooccur.values()) if cooccur else 1
    edge_threshold_pct = 3
    edge_threshold = max(1, int(max_cooccur * edge_threshold_pct / 100))

    edges = []
    for (w1, w2), count in cooccur.items():
        if count >= edge_threshold:
            edges.append({
                "from": w1,
                "to": w2,
                "weight": count
            })

    max_freq = max(word_freq.values()) if word_freq else 1
    nodes = []
    for word, count in word_freq.items():
        size = 8 + 22 * (count / max_freq)
        nodes.append({
            "id": word,
            "label": word,
            "size": size,
            "frequency": count,
            "fontSize": 8 + 12 * (count / max_freq)
        })

    # Build word→sentences map with offsets (only for words that made it into the graph)
    word_sentences = {}
    for word in unique_words:
        sent_data = lemma_sentences.get(word, {})
        sents = []
        for sent_text, (start, end) in sent_data.items():
            sents.append({"text": sent_text, "start": start, "end": end})
        word_sentences[word] = sents

    # Build surface forms map (only for words that made it into the graph)
    word_forms = {}
    for word in unique_words:
        forms = sorted(lemma_surface_forms.get(word, {word}), key=lambda f: -len(f))
        word_forms[word] = forms

    # Heatmap
    chunks = []
    for i in range(0, len(tokens), chunk_step):
        chunk = tokens[i:i + chunk_size]
        if len(chunk) >= 5:
            chunks.append(" ".join(chunk))

    if not chunks:
        chunks = [" ".join(tokens)]

    vectorizer = TfidfVectorizer(max_features=top_k_concepts * 2)
    tfidf_matrix = vectorizer.fit_transform(chunks)
    feature_names = vectorizer.get_feature_names_out()
    feature_scores = np.array(tfidf_matrix.sum(axis=0)).flatten()
    top_indices = np.argsort(feature_scores)[-top_k_concepts:]
    top_indices = top_indices[::-1]
    concepts = [feature_names[i] for i in top_indices]

    matrix = []
    chunk_labels = []
    for i, chunk in enumerate(chunks):
        chunk_display = chunk[:60] + "..." if len(chunk) > 60 else chunk
        chunk_labels.append(f"Chunk {i+1}: {chunk_display}")
        row = []
        for concept in concepts:
            idx = np.where(feature_names == concept)[0]
            if len(idx) > 0:
                row.append(float(tfidf_matrix[i, idx[0]]))
            else:
                row.append(0.0)
        matrix.append(row)

    heatmap = {
        "chunks": chunk_labels,
        "concepts": concepts,
        "matrix": matrix
    }

    word_groups_map = {}
    word_to_group = {}
    try:
        pos_map = {}
        for w in unique_words:
            c = lemma_pos.get(w, Counter())
            pos_map[w] = c.most_common(1)[0][0] if c else "NOUN"
        w2g, groups = compute_word_groups(unique_words, pos_map)
        word_to_group = w2g
        word_groups_map = groups
    except Exception:
        pass

    return {"nodes": nodes, "edges": edges, "heatmap": heatmap, "word_sentences": word_sentences, "word_forms": word_forms, "original_text": text, "word_to_group": word_to_group, "word_groups": word_groups_map}
