#include <stdint.h>
#include <emscripten.h>

extern "C" {

EMSCRIPTEN_KEEPALIVE
void invert_image(uint8_t *pixels, int width, int height) {
    int total = width * height * 4;
    for (int i = 0; i < total; i += 4) {
        pixels[i] = 255 - pixels[i];
        pixels[i + 1] = 255 - pixels[i + 1];
        pixels[i + 2] = 255 - pixels[i + 2];
    }
}

}