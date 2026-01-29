"""
Archivo principal para ejecutar Flask desde la raíz
"""
import sys
from pathlib import Path

# Agregar el directorio backend al path
sys.path.insert(0, str(Path(__file__).parent))

from app.app import app

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
