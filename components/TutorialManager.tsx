
import React from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { useTutorial } from '../contexts/TutorialContext';
import { JOYRIDE_LOCALE, JOYRIDE_STYLES } from '../src/constants/tutorialSteps';

const TutorialManager: React.FC = () => {
  const { run, steps, completeTutorial, activeTutorialId } = useTutorial();

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      if (activeTutorialId) {
        completeTutorial(activeTutorialId);
      }
    }
  };

  if (!steps || steps.length === 0) return null;

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={activeTutorialId ? run : false}
      scrollToFirstStep
      scrollOffset={150}
      showProgress
      showSkipButton
      disableScrollParentFix={false}
      disableScrolling={false}
      spotlightPadding={12}
      steps={steps}
      locale={JOYRIDE_LOCALE}
      styles={JOYRIDE_STYLES}
      floaterProps={{
        disableAnimation: true,
      }}
    />
  );
};

export default TutorialManager;
