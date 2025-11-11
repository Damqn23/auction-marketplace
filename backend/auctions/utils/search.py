# auctions/utils/search.py

from typing import List


def levenshtein(a: str, b: str) -> int:
    """
    Returns the Levenshtein distance between two strings `a` and `b`.
    This is a measure of how many single-character edits (insertions,
    deletions, or substitutions) are needed to transform `a` into `b`.
    """
    if len(a) < len(b):
        return levenshtein(b, a)
    if len(b) == 0:
        return len(a)

    dp = range(len(b) + 1)
    for i, char_a in enumerate(a):
        new_dp = [i + 1]
        for j, char_b in enumerate(b):
            cost = 0 if char_a == char_b else 1
            new_dp.append(
                min(
                    dp[j] + cost,      # substitution
                    dp[j + 1] + 1,     # deletion
                    new_dp[-1] + 1,    # insertion
                )
            )
        dp = new_dp
    return dp[-1]


def fuzzy_match(candidate: str, query: str) -> bool:
    """
    Returns True if `candidate` string fuzzily matches `query`.
    1) If query is a direct substring of candidate, return True immediately.
    2) Otherwise, for every query word, ensure it has at least one
       candidate word within a Levenshtein distance threshold.
    """
    candidate_lower = candidate.lower()
    query_lower = query.lower()

    if query_lower in candidate_lower:
        return True

    candidate_words: List[str] = candidate_lower.split()
    query_words: List[str] = query_lower.split()

    for qw in query_words:
        matched_this_query_word = False
        for cw in candidate_words:
            dist = levenshtein(cw, qw)
            threshold = max(1, len(qw) // 3)
            if dist <= threshold:
                matched_this_query_word = True
                break
        if not matched_this_query_word:
            return False

    return True
