export function avatarBytesToUrl(bytes: Uint8Array | null | undefined): string | null {
    if (!bytes || bytes.length === 0) return null;

    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    const base64 = window.btoa(binary);
    return `data:image/png;base64,${base64}`;
}
