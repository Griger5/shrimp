@group(0) @binding(0) var img: texture_2d<f32>;
@group(0) @binding(1) var samp: sampler;

@fragment
fn main(@builtin(position) p: vec4<f32>) -> @location(0) vec4<f32> {
    let dims = vec2<f32>(textureDimensions(img));
    let uv = p.xy / dims;
    return textureSample(img, samp, uv);
}