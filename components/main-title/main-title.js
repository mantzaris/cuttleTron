const { ipcRenderer } = window.electron;

document.addEventListener('DOMContentLoaded', function() {
  const button = document.getElementById("install-dependencies");
  const hasRunBefore = localStorage.getItem('hasRunBefore');

  if (hasRunBefore) {
     //do nothing
  } else {
    ipcRenderer.invoke('show-dialog', {
      type: 'info',
      title: 'Install dependencies',
      message: `It is a good idea to install the dependencies via your own package manager.`,
      buttons: ['OK'],
      defaultId: 0
    }).then(() => {
      // Start flashing after the dialog is closed
      if (button) {
        button.classList.add('flash');
        
        // Optionally, remove the class after some time
        setTimeout(() => {
            button.classList.remove('flash');
        }, 4000); // Adjust time as needed
      }
    });

    localStorage.setItem('hasRunBefore', true);
  }
});


document.getElementById("install-dependencies").onclick = () => {
  ipcRenderer.invoke("install-dependencies").then((response) => {

    let dialogOptions;
    console.log(`insallation response=${JSON.stringify(response)}`);

    if (response.success && !response.canceled) {
      console.log("Dependencies installed successfully.");

      dialogOptions = {
        type: 'info',
        title: 'Installation Process Finished',
        message: `The process of installation is finished successfully. Failures=${response.failures}, Successes=${response.successes}`,
        buttons: ['OK'],
        defaultId: 0
      };
    } else if(!response.success && !response.canceled) {
      dialogOptions = {
        type: 'info',
        title: 'Installation Process Finished',
        message: `The process of installation is partially successfully. Failures=${response.failures}, Successes=${response.successes}`,
        buttons: ['OK'],
        defaultId: 0
      };
    }  else if (response.canceled) {
      console.log("Installation canceled by the user.");
      dialogOptions = {
        type: 'info',
        title: 'Installation Canceled',
        message: "The installation was canceled by the user.",
        buttons: ['OK'],
        defaultId: 0
      };
    } else {
      console.error(`Installation failed: ${response.error}`);
      dialogOptions = {
        type: 'error',
        title: 'Installation Process Error',
        message: `Package installation error: ${response.error} `,
        buttons: ['OK'],
        defaultId: 0
      };
    }

    ipcRenderer.invoke('show-dialog', dialogOptions);
  });
};
