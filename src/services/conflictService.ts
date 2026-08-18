export class ConflictService {
  /**
   * Financial transactions (Credit and Payment) are append-only.
   * Merges multi-device transaction entries safely without overwriting or doubling amounts.
   */
  public static mergeTransactions(localTxList: any[], serverTxList: any[]): any[] {
    const map = new Map<string, any>();

    for (const tx of localTxList) {
      map.set(tx.id || tx._id, tx);
    }

    for (const tx of serverTxList) {
      const id = tx.id || tx._id;
      const existing = map.get(id);

      if (!existing) {
        map.set(id, tx);
      } else {
        // Idempotent merge: Keep server metadata if newer
        const localTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
        const serverTime = new Date(tx.updatedAt || tx.createdAt || 0).getTime();

        if (serverTime >= localTime) {
          map.set(id, { ...existing, ...tx });
        }
      }
    }

    return Array.from(map.values());
  }

  /**
   * Customer Profile Field-Level Merge (Name, Phone, Address, Image, CustomerCode)
   * Uses server-authoritative timestamps while preserving non-null local edits.
   */
  public static mergeCustomerRecord(localCustomer: any, serverCustomer: any): any {
    if (!localCustomer) return serverCustomer;
    if (!serverCustomer) return localCustomer;

    const localTime = new Date(localCustomer.updatedAt || localCustomer.createdAt || 0).getTime();
    const serverTime = new Date(serverCustomer.updatedAt || serverCustomer.createdAt || 0).getTime();

    // Soft Delete Rule: If either side is deleted, deletion takes precedence unless explicitly restored
    const isLocalDeleted = Boolean(localCustomer.deletedAt);
    const isServerDeleted = Boolean(serverCustomer.deletedAt);

    if (isServerDeleted && !isLocalDeleted && serverTime > localTime) {
      return { ...localCustomer, ...serverCustomer, deletedAt: serverCustomer.deletedAt };
    }

    if (serverTime >= localTime) {
      return {
        ...localCustomer,
        ...serverCustomer,
        imageLocalUri: localCustomer.imageLocalUri || serverCustomer.image || '',
        customerCode: serverCustomer.customerCode || localCustomer.customerCode,
      };
    } else {
      return {
        ...serverCustomer,
        ...localCustomer,
        customerCode: localCustomer.customerCode || serverCustomer.customerCode,
      };
    }
  }
}
