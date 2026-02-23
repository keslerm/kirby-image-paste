panel.plugin("keslerm/image-paste", {
  created(app) {
    const panel = app.$panel;

    document.addEventListener("paste", (e) => {
      // Don't intercept paste in editable elements
      const el = document.activeElement;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable)
      ) {
        return;
      }

      // Don't intercept if a dialog is already open
      if (panel.dialog.isOpen) {
        return;
      }

      const files = getImageFiles(e.clipboardData);
      if (files.length === 0) {
        return;
      }

      // We need a model API path to know where to upload
      const api = panel.view.props?.api;
      if (!api) {
        return;
      }

      e.preventDefault();

      // Build a FileList-like object from our files array
      const dataTransfer = new DataTransfer();
      for (const file of files) {
        dataTransfer.items.add(file);
      }

      panel.upload.open(dataTransfer.files, {
        url: panel.urls.api + "/" + api + "/files",
        accept: "image/*",
        multiple: true,
      });
    });
  },
});

/**
 * Extract image files from clipboard data.
 * Handles both raw image data (screenshots) and copied files.
 */

function getImageFiles(clipboardData) {
  if (!clipboardData) {
    return [];
  }

  const files = [];
  const items = clipboardData.items;

  if (!items || items.length === 0) {
    return [];
  }

  for (const item of items) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (!file) {
        continue;
      }

      // Raw clipboard images (screenshots) have no useful name,
      // browsers typically give them "image.png" — generate a
      // timestamped name instead.
      if (!file.name || file.name === "image.png") {
        const ext = file.type.split("/")[1] || "png";
        const ts = new Date()
          .toISOString()
          .replace(/[-:T]/g, "")
          .replace(/\..+/, "")
          .replace(/(\d{8})(\d{6})/, "$1-$2");
        const name = "pasted-image-" + ts + "." + ext;
        files.push(new File([file], name, { type: file.type }));
      } else {
        files.push(file);
      }
    }
  }

  return files;
}
