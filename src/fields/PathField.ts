import { Field } from "./Field";
import { State } from "../states/State";
import { validateJSONPath } from "../utils";

export class PathField<T extends State> extends Field<T> {
    required: false;
    private inputPath: string | null = null;
    private outputPath: string | null = null;

    validate() {
        if (this.inputPath !== null) {
            const error = validateJSONPath(this.inputPath);
            if(error) {
                return error;
            }
        }

        if (this.outputPath !== null) {
            const error = validateJSONPath(this.outputPath);
            if(error) {
                return error;
            }
        }

        return null;
    }

    setInput(path: string): T {
        let err = validateJSONPath(path);
        if(err)  {
            throw err;
        }
        this.receiveConfiguration();
        this.inputPath = path
        return this.getParentState();
    }

    getInput() {
        return this.inputPath;
    }

    setOutput(path: string): T {
        let err = validateJSONPath(path);
        if(err)  {
            throw err;
        }
        this.receiveConfiguration();
        this.outputPath = path
        return this.getParentState();
    }

    getOutput() {
        return this.outputPath;
    }
}