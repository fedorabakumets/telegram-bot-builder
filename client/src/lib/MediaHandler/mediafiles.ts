import { generateAudioHandlerCode, generateDocumentHandlerCode, generatePhotoHandlerCode, generateVideoHandlerCode, hasAudioInput, hasDocumentInput, hasPhotoInput, hasVideoInput } from '.';

export function mediafiles(nodes: any[], navigationCode: string, code: string) {
    if (hasPhotoInput(nodes || [])) {
        let photoCode = generatePhotoHandlerCode();
        photoCode = photoCode.replace('            # (здесь будет сгенерированный код навигации)', navigationCode);
        code += photoCode;
    }
    if (hasVideoInput(nodes || [])) {
        let videoCode = generateVideoHandlerCode();
        videoCode = videoCode.replace('            # (зzzесь будет сгенерированный код навигации)', navigationCode);
        code += videoCode;
    }
    if (hasAudioInput(nodes || [])) {
        let audioCode = generateAudioHandlerCode();
        audioCode = audioCode.replace('            # (здеzzь будет сгенерированный код навигации)', navigationCode);
        code += audioCode;
    }
    if (hasDocumentInput(nodes || [])) {
        let docCode = generateDocumentHandlerCode();
        docCode = docCode.replace('            # (здесь будет сгенерированный код навигации)', navigationCode);
        code += docCode;
    }
    return code;
}
