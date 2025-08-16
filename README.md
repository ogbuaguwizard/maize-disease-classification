
# Maize Disease Classification (ONNX.js)

This project is a browser-based maize leaf disease detection system powered by ONNX.js and React. It uses a Vision Transformer (ViT) model trained to classify maize leaf images into four categories:

- **Common Rust**
- **Gray Leaf Spot**
- **Blight**
- **Healthy**

## Features
- 100% client-side inference (no server required)
- Drag & drop or browse to upload images
- Fast predictions after first model load (model is cached in browser)
- Modern, responsive UI

## Demo
Run locally and open your browser to [http://localhost:3000](http://localhost:3000) (or the port shown in your terminal).

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/ogbuaguwizard/maize-disease-classification.git
cd maize-disease-classification
```

### 2. Install dependencies
```bash
npm install
```

### 3. Add the ONNX model
Place your ONNX model file as `public/maize_vit_model.onnx`.

### 4. Start the development server
```bash
npm run dev
```


## Model Training Details

The maize disease classification model was trained using a Vision Transformer (ViT) architecture with PyTorch and HuggingFace Transformers. The full training pipeline, including data preparation, EDA, model training, evaluation, and export, is documented in the notebook:

- [`vision_transformers_maize_leaf_disease_detection_s.ipynb`](https://github.com/ogbuaguwizard/maize-disease-classification/vision_transformers_maize_leaf_disease_detection_s.ipynb)

### Training Steps
1. **Dataset**: [Corn or Maize Leaf Disease Dataset (Kaggle)](https://www.kaggle.com/datasets/smaranjitghose/corn-or-maize-leaf-disease-dataset)
2. **Preprocessing**: Images resized to 224x224, normalized using ViT image processor stats.
3. **Splitting**: 70% train, 15% validation, 15% test.
4. **Model**: `google/vit-base-patch16-224` fine-tuned for 4 classes.
5. **Training**: HuggingFace `Trainer` API, with accuracy, precision, recall, and F1 metrics.
6. **Evaluation**: Metrics and confusion matrix on the test set.
7. **Export**: Model saved and converted to ONNX for browser inference.

### Class Mapping
```
0: Common Rust
1: Gray Leaf Spot
2: Blight
3: Healthy
```

### Model Weights
- **Hugging Face Model Hub**: [francis-ogbuagu/maize_vit_model](https://huggingface.co/francis-ogbuagu/maize_vit_model)
	- Contains PyTorch and ONNX weights, plus the image processor config.

### Quick Start for Training
See the notebook for all code. Example snippet:

```python
from transformers import ViTForImageClassification, Trainer, TrainingArguments
model = ViTForImageClassification.from_pretrained(
	"google/vit-base-patch16-224",
	num_labels=4,
	ignore_mismatched_sizes=True
)
# ...
trainer = Trainer(
	model=model,
	args=TrainingArguments(...),
	train_dataset=hf_train_dataset,
	eval_dataset=hf_val_dataset,
	compute_metrics=compute_metrics
)
trainer.train()
```

For full details, see the notebook in this repo.

## Tech Stack
- React
- ONNX.js (`onnxruntime-web`)
- Vite
- Lucide React Icons

## Credits
- Model training and notebook: see `vision_transformers_maize_leaf_disease_detection_s.ipynb`
- Dataset: [Kaggle - Corn or Maize Leaf Disease Dataset](https://www.kaggle.com/datasets/smaranjitghose/corn-or-maize-leaf-disease-dataset)

## License
MIT
