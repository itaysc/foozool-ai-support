import { actionKeywords, entityKeywords } from "./keywords";
import { InstructionsText, InstructionKeyword, InstructionsTextWrapper } from "./styled";

const ChatInstructions = () => {
  return (
    <InstructionsTextWrapper>
        <InstructionsText>
         How can I assist you?
        </InstructionsText>
        {/* <InstructionsText style={{marginTop: '10px'}}>
            for example:
        </InstructionsText>
        <InstructionsText style={{marginTop: '5px'}}>
                {'"create invoice for <customer> with amount of X USD, due date is for tommorow"'}
        </InstructionsText>
        <InstructionsText style={{marginTop: '10px'}}>
            Or
        </InstructionsText>
        <InstructionsText style={{marginTop: '10px'}}>
            "create accrual report for 2025-01-01 to 2025-01-31"
        </InstructionsText> */}
    </InstructionsTextWrapper>
  );
};

export default ChatInstructions;