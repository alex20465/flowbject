
const JPATH_VALIDATOR_EXPRESSION = /^\$\./;
/**
 * @todo: Test this and allow more valid json-paths
 */
export function validateJSONPath(path: string): null | Error {
    if(JPATH_VALIDATOR_EXPRESSION.test(path)) {
        return null;
    } else {
        return new Error(`Invalid json-path expression "${path}"`);
    }
}