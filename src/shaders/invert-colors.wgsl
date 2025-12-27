@group(0) @binding(0)
var inputTex: texture_2d<f32>;
@group(0) @binding(1)
var outputTex: texture_storage_2d<rgba8unorm, write>;

@compute @workgroup_size(16,16)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
    let dims = textureDimensions(inputTex);
    
    if (gid.x >= dims.x || gid.y >= dims.y) { return; }

    let pixel = textureLoad(inputTex, vec2<i32>(i32(gid.x), i32(gid.y)), 0);
    let inverted = vec4<f32>(1.0 - pixel.rgb, pixel.a);
    textureStore(outputTex, vec2<i32>(i32(gid.x), i32(gid.y)), inverted);
}