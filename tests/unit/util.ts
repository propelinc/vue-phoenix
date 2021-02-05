// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function supressPromiseRejection(promise: Promise<any>) {
    try {
        await promise;
    } catch(e) {
        // Suppress.
    }
}