
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_noise_scale;
uniform float u_circle_size;

#include "lygia/space/ratio.glsl"
#include "lygia/draw/fill.glsl"
#include "lygia/draw/stroke.glsl"
#include "lygia/draw/flip.glsl"
#include "lygia/sdf/circleSDF.glsl"
#include "lygia/space/scale.glsl"
#include "lygia/generative/snoise.glsl"
#include "lygia/color/blend/multiply.glsl"

void main(void) {
    vec3 color = vec3(0.0);
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    float breathSin = sin(u_time) + 4.0;
    st = scale(ratio(st, u_resolution), breathSin);

    float baseTimeMult = 0.7;
    float noise1 = snoise(vec3(st * u_noise_scale, u_time * baseTimeMult));
    float noise2 = snoise(vec3(st * u_noise_scale, u_time * (baseTimeMult)));
    vec3 totalNoise = blendMultiply(vec3(noise1), vec3(noise2), 1.0);
    vec3 colorNoise = mix(vec3(1.0, 0.0, 0.6), vec3(0.0, 0.0, 1.0), totalNoise);

    // Circle
    float circleSdf = circleSDF(st);
    float circleStroke = 0.1;
    float circleScale = u_circle_size;

    color += colorNoise;
    color += flip(fill(circleSdf, circleScale, 0.0), 1.0);

    // Circle stroke
    color -= stroke(circleSdf, circleScale, circleStroke + breathSin*0.01) * 2.0;
    
    gl_FragColor = vec4(color, 1.0);
}
