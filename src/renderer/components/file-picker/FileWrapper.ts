
export class FileWrapper<T = any> {
    public readonly file:File;

    public readonly extension:string;

    public progress:number = 0;

    public content?:string;

    private reader: FileReader;

    private loadPromise?: Promise<string>;

    private _data?:T;

    constructor(file:File, extension:string) {
        this.file = file;
        this.extension = extension;
        this.reader = new FileReader();
    }

    get name() {
        return this.file.name;
    }

    get type() {
        return this.file.type;
    }

    get size() {
        return this.file.size;
    }

    get data() {
        return this._data;
    }

    isLoaded() {
        return !!this.content;
    }

    loadAsText(parser?:(file:FileWrapper) => T):Promise<string> {
        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.loadPromise = new Promise((resolve, reject) => {

            this.reader.addEventListener('progress', (evt:ProgressEvent) => {
                this.progress = evt.loaded / evt.total;
            });

            this.reader.addEventListener('load', () => {
                if (!this.reader.result) {
                    reject(new Error('No file result available'));
                    return;
                }

                if (typeof this.reader.result === 'string') {
                    this.content = this.reader.result;
                    if (parser) {
                        this._data = parser(this);
                    }
                    resolve(this.content);
                    return;
                }

                reject(new Error('File result was invalid'));

            });

            this.reader.readAsText(this.file);
        });

        return this.loadPromise;
    }
}