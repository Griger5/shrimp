.PHONY: all configure build clean

CC := emcc
CFLAGS := -O3 -s WASM=1 -s MODULARIZE=1 -s EXPORT_ES6=1 -s ALLOW_MEMORY_GROWTH=1 -s EXPORTED_FUNCTIONS="['_malloc','_free']" -s EXPORTED_RUNTIME_METHODS="['cwrap', 'HEAPU8']"
SRC_DIR := src/wasm
WASM_DIR := public/wasm
SOURCE_EMSDK := cd external/emsdk && . ./emsdk_env.sh && cd ../..

all: configure build

configure:
	git clone https://github.com/emscripten-core/emsdk.git external/emsdk
	./external/emsdk/emsdk install latest
	./external/emsdk/emsdk activate latest
	mkdir -p ${WASM_DIR}

build:
	${SOURCE_EMSDK} && ${CC} ${CFLAGS} ${SRC_DIR}/image-manipulation.cpp -o ${WASM_DIR}/image-manipulation.js

clean:
	rm -rf external/emsdk
	rmdir external
	rm -rf ${WASM_DIR}/*