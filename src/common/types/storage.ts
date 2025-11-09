export interface FileData {
    filename: string;
    fileData: ArrayBuffer;
}

export interface FileStorage {
    upload(data: FileData, folder: string): Promise<any>;
    delete(filename: string): Promise<void>;
    getObjectUri(filename: string): string;
}
