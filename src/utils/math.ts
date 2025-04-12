export function createUniqueId(): string {
    return Math.random().toString(16).slice(2);
}