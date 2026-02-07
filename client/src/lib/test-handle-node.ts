import { generateHandleNodeFunctions } from './generate/generateHandleNodeFunctions';

// Тестовые данные
const testNodes = [
  {
    id: "sIh3xXKEtb_TtrhHqZQzX",
    type: "message",
    data: {
      messageText: "Из какого ты города?",
      imageUrl: "/uploads/19/2026-02-07/1770431196657-451005506-photo_8_2026-01-22_06-42-34.jpg",
      inputVariable: "city",
      collectUserInput: true,
      enableConditionalMessages: true,
      conditionalMessages: [
        {
          id: "cond-city-1",
          condition: "user_data_exists",
          variableName: "city",
          variableNames: ["city"],
          logicOperator: "AND",
          expectedValue: "",
          messageText: "\n",
          formatMode: "text",
          keyboardType: "reply",
          buttons: [
            {
              id: "btn-city-yes",
              text: "{city}",
              action: "goto",
              target: "tS2XGL2Mn4LkE63SnxhPy",
              url: "",
              buttonType: "normal",
              skipDataCollection: false,
              hideAfterClick: false
            }
          ],
          resizeKeyboard: true,
          oneTimeKeyboard: false,
          collectUserInput: false,
          enableTextInput: false,
          enablePhotoInput: false,
          enableVideoInput: false,
          enableAudioInput: false,
          enableDocumentInput: false,
          inputVariable: "",
          textInputVariable: "",
          photoInputVariable: "",
          videoInputVariable: "",
          audioInputVariable: "",
          documentInputVariable: "",
          nextNodeAfterInput: "tS2XGL2Mn4LkE63SnxhPy",
          priority: 10,
          showCustomMessage: false,
          waitForTextInput: true
        }
      ],
      attachedMedia: ["image_url_sIh3xXKEtb_TtrhHqZQzX"],
      inputTargetNodeId: "tS2XGL2Mn4LkE63SnxhPy"
    }
  }
];

const mediaVariablesMap = new Map();

console.log('Generated code:');
console.log(generateHandleNodeFunctions(testNodes, mediaVariablesMap));