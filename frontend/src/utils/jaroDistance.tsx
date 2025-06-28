function jaroDistance(s1: string, s2: string): number {
    const m = getMatchingCharacters(s1, s2);
    if (m.length === 0) return 0;

    const t = getTranspositions(s1, s2, m);

    return (1 / 3) * (
        m.length / s1.length +
        m.length / s2.length +
        (m.length - t / 2) / m.length
    );
}

function getMatchingCharacters(s1: string, s2: string): string[] {
    const matchDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
    const matched = [];
    const s2Matched = new Array(s2.length).fill(false);

    for (let i = 0; i < s1.length; i++) {
        const start = Math.max(0, i - matchDistance);
        const end = Math.min(i + matchDistance + 1, s2.length);

        for (let j = start; j < end; j++) {
        if (!s2Matched[j] && s1[i] === s2[j]) {
            matched.push(s1[i]);
            s2Matched[j] = true;
            break;
        }
        }
    }

    return matched;
}

function getTranspositions(s1: string, s2: string, matched: string[]): number {
    const s1Matched = matched;
    const s2Matched = getMatchingCharacters(s2, s1);
    let t = 0;
    for (let i = 0; i < s1Matched.length; i++) {
        if (s1Matched[i] !== s2Matched[i]) t++;
    }
    return t;
}

export default jaroDistance;