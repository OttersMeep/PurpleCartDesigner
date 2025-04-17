import tkinter as tk
from tkinter import filedialog, messagebox
from PIL import Image, ImageTk
import os

class BlockMapperApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Minecraft Block Mapper")

        self.mode = tk.StringVar(value="A")
        self.textures = {}

        self.setup_ui()

    def setup_ui(self):
        # Mode selection
        mode_frame = tk.LabelFrame(self.root, text="Mapping Mode")
        mode_frame.pack(padx=10, pady=10, fill="x")

        tk.Radiobutton(mode_frame, text="A: Side texture only", variable=self.mode, value="A", command=self.update_mode).pack(anchor="w")
        tk.Radiobutton(mode_frame, text="B: Top, Bottom, and Side texture", variable=self.mode, value="B", command=self.update_mode).pack(anchor="w")
        tk.Radiobutton(mode_frame, text="C: Individual texture for each side", variable=self.mode, value="C", command=self.update_mode).pack(anchor="w")

        # Texture selectors
        self.texture_frame = tk.LabelFrame(self.root, text="Textures")
        self.texture_frame.pack(padx=10, pady=10, fill="x")
        self.update_mode()

        # Generate button
        generate_btn = tk.Button(self.root, text="Generate Preview", command=self.generate_preview)
        generate_btn.pack(pady=5)
        export_btn = tk.Button(self.root, text="Export as 64x64 Image", command=self.export_as_image)
        export_btn.pack(pady=5)


        # Preview canvas
        self.canvas = tk.Canvas(self.root, width=300, height=200, bg="white")
        self.canvas.pack(padx=10, pady=10)

    def update_mode(self):
        for widget in self.texture_frame.winfo_children():
            widget.destroy()
        self.textures.clear()

        if self.mode.get() == "A":
            self.add_texture_button("side")
        elif self.mode.get() == "B":
            self.add_texture_button("top")
            self.add_texture_button("bottom")
            self.add_texture_button("side")
        elif self.mode.get() == "C":
            for face in ["top", "bottom", "left", "right", "front", "back"]:
                self.add_texture_button(face)

    def add_texture_button(self, name):
        def load_file():
            file_path = filedialog.askopenfilename(
                filetypes=[("Image Files", ("*.png", "*.jpg", "*.jpeg"))]
            )
            if file_path:
                self.textures[name] = Image.open(file_path).resize((64, 64))
                label.config(text=os.path.basename(file_path))

        frame = tk.Frame(self.texture_frame)
        frame.pack(fill="x", pady=2)

        tk.Label(frame, text=f"{name.capitalize()} Texture:").pack(side="left", padx=5)
        label = tk.Label(frame, text="None", width=20, anchor="w")
        label.pack(side="left")
        tk.Button(frame, text="Browse", command=load_file).pack(side="right", padx=5)

    def generate_preview(self):
        mode = self.mode.get()

        if mode == "A":
            img = self.textures.get("side")
            if not img:
                return messagebox.showerror("Missing Texture", "Please select a side texture.")
            preview = self.generate_cube_map({"top": img, "bottom": img, "left": img, "right": img, "front": img, "back": img})

        elif mode == "B":
            required = ["top", "bottom", "side"]
            if not all(face in self.textures for face in required):
                return messagebox.showerror("Missing Textures", "Please select top, bottom, and side textures.")
            side = self.textures["side"]
            preview = self.generate_cube_map({
                "top": self.textures["top"],
                "bottom": self.textures["bottom"],
                "left": side,
                "right": side,
                "front": side,
                "back": side
            })

        elif mode == "C":
            required = ["top", "bottom", "left", "right", "front", "back"]
            if not all(face in self.textures for face in required):
                return messagebox.showerror("Missing Textures", "Please select textures for all 6 faces.")
            preview = self.generate_cube_map(self.textures)
        self.latest_preview = preview
        self.display_preview(preview)

    def generate_cube_map(self, textures):
        tile_size = 16
        cols, rows = 4, 4
        layout = Image.new("RGBA", (cols * tile_size, rows * tile_size), (255, 255, 255, 0))

        # Map logical cube sides to canvas grid positions
        face_positions = {
            "top":    (1, 0),
            "bottom": (2, 0),
            "right":  (0, 1),
            "front":  (1, 1),
            "left":   (2, 1),
            "back":   (3, 1),
        }

        for face, pos in face_positions.items():
            x, y = pos
            tex = textures.get(face)
            if tex:
                tex = tex.resize((tile_size, tile_size), Image.NEAREST)
                layout.paste(tex, (x * tile_size, y * tile_size))

        return layout



    def display_preview(self, image):
       # Calculate scale while keeping aspect ratio
      max_width, max_height = 300, 300
      w_ratio = max_width / image.width
      h_ratio = max_height / image.height
      scale = min(w_ratio, h_ratio)

      new_width = int(image.width * scale)
      new_height = int(image.height * scale)
      resized = image.resize((new_width, new_height), Image.NEAREST)

      self.tk_preview = ImageTk.PhotoImage(resized)
      self.canvas.config(width=new_width, height=new_height)
      self.canvas.create_image(0, 0, anchor="nw", image=self.tk_preview)
      return

    def export_as_image(self):
        if not hasattr(self, 'latest_preview'):
            return messagebox.showinfo("Nothing to Export", "Please generate a preview first.")

        output_path = filedialog.asksaveasfilename(
            defaultextension=".png",
            filetypes=[("PNG Image", "*.png")],
            title="Save As"
        )
        if not output_path:
           return

        # Save the layout resized to 64x64
        resized = self.latest_preview.resize((64, 64), Image.NEAREST)
        resized.save(output_path)
        messagebox.showinfo("Exported", f"Image saved to:\n{output_path}")


if __name__ == "__main__":
    root = tk.Tk()
    app = BlockMapperApp(root)
    root.mainloop()
