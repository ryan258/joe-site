#!/usr/bin/env bash

set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
image_dir="${project_root}/static/images"
motion_tmp="$(mktemp -d /tmp/joe-motion-webp.XXXXXX)"

cleanup() {
  rm -rf "${motion_tmp}"
}
trap cleanup EXIT

frame_count=16
frame_delay=220
pulse=(08 10 13 16 20 24 27 29 27 24 20 16 13 10 08 07)

make_base() {
  local source_image="$1"
  local geometry="$2"
  local output_image="$3"

  magick "${source_image}" \
    -auto-orient \
    -resize "${geometry}^" \
    -gravity center \
    -extent "${geometry}" \
    -colorspace sRGB \
    "${output_image}"
}

encode_animation() {
  local frame_dir="$1"
  local output_image="$2"
  local quality="$3"
  local -a encoder_args

  encoder_args=(-min_size -mixed -loop 0)
  for frame in "${frame_dir}"/frame-*.png; do
    encoder_args+=(-d "${frame_delay}" -lossy -q "${quality}" -m 6 "${frame}")
  done

  img2webp "${encoder_args[@]}" -o "${output_image}"
}

build_hero() {
  local work_dir="${motion_tmp}/hero"
  local base_image="${work_dir}/base.png"
  mkdir -p "${work_dir}"
  make_base "${image_dir}/joe_cockpit.webp" "840x630" "${base_image}"

  for ((i = 0; i < frame_count; i++)); do
    local alpha="0.${pulse[$i]}"
    local mote_y=$((92 + ((i * 27) % 430)))
    local mote_y_2=$((520 - ((i * 31) % 420)))
    local mote_x=$((195 + ((i * 11) % 115)))
    local frame_path
    frame_path="${work_dir}/frame-$(printf '%02d' "${i}").png"

    magick -size 840x630 xc:none \
      -fill "rgba(52,211,153,${alpha})" -draw "ellipse 244,177 94,108 0,360" \
      -fill "rgba(34,211,238,${alpha})" -draw "ellipse 704,194 58,190 0,360" \
      -blur 0x24 "${work_dir}/glow.png"

    magick -size 840x630 xc:none \
      -fill "rgba(167,243,208,0.82)" -draw "circle ${mote_x},${mote_y} $((mote_x + 3)),${mote_y}" \
      -fill "rgba(103,232,249,0.78)" -draw "circle 690,${mote_y_2} 693,${mote_y_2}" \
      -fill "rgba(253,230,138,0.58)" -draw "circle $((530 + (i * 13) % 180)),$((510 - (i * 17) % 270)) $((532 + (i * 13) % 180)),$((510 - (i * 17) % 270))" \
      -blur 0x1 "${work_dir}/motes.png"

    magick "${base_image}" \
      "${work_dir}/glow.png" -compose screen -composite \
      "${work_dir}/motes.png" -compose screen -composite \
      "${frame_path}"
  done

  encode_animation "${work_dir}" "${image_dir}/joe_cockpit_motion.webp" 74
}

build_cow() {
  local work_dir="${motion_tmp}/cow"
  local base_image="${work_dir}/base.png"
  mkdir -p "${work_dir}"
  make_base "${image_dir}/cow_flight.webp" "960x536" "${base_image}"

  for ((i = 0; i < frame_count; i++)); do
    local alpha="0.${pulse[$i]}"
    local trail_x=$((430 + ((i * 29) % 300)))
    local trail_y=$((345 - ((i * 13) % 130)))
    local high_x=$((520 + ((i * 23) % 250)))
    local frame_path
    frame_path="${work_dir}/frame-$(printf '%02d' "${i}").png"

    magick -size 960x536 xc:none \
      -fill "rgba(52,211,153,${alpha})" -draw "ellipse 746,264 136,154 0,360" \
      -fill "rgba(16,185,129,${alpha})" -draw "ellipse 585,302 210,70 0,360" \
      -blur 0x28 "${work_dir}/glow.png"

    magick -size 960x536 xc:none \
      -fill "rgba(167,243,208,0.86)" -draw "circle ${trail_x},${trail_y} $((trail_x + 4)),${trail_y}" \
      -fill "rgba(110,231,183,0.68)" -draw "circle ${high_x},$((180 + (i * 9) % 110)) $((high_x + 3)),$((180 + (i * 9) % 110))" \
      -fill "rgba(52,211,153,0.72)" -draw "circle $((360 + (i * 37) % 390)),$((390 - (i * 19) % 185)) $((363 + (i * 37) % 390)),$((390 - (i * 19) % 185))" \
      -blur 0x1 "${work_dir}/motes.png"

    magick "${base_image}" \
      "${work_dir}/glow.png" -compose screen -composite \
      "${work_dir}/motes.png" -compose screen -composite \
      "${frame_path}"
  done

  encode_animation "${work_dir}" "${image_dir}/cow_flight_motion.webp" 72
}

build_fire() {
  local work_dir="${motion_tmp}/fire"
  local base_image="${work_dir}/base.png"
  mkdir -p "${work_dir}"
  make_base "${image_dir}/sculpt_fire.webp" "960x536" "${base_image}"

  for ((i = 0; i < frame_count; i++)); do
    local alpha="0.${pulse[$i]}"
    local spark_x=$((235 + ((i * 19) % 170)))
    local spark_y=$((355 - ((i * 23) % 245)))
    local ward_y=$((385 - ((i * 17) % 170)))
    local frame_path
    frame_path="${work_dir}/frame-$(printf '%02d' "${i}").png"

    magick -size 960x536 xc:none \
      -fill "rgba(249,115,22,${alpha})" -draw "ellipse 300,226 172,158 0,360" \
      -fill "rgba(34,211,238,${alpha})" -draw "ellipse 717,310 228,208 0,360" \
      -blur 0x30 "${work_dir}/glow.png"

    magick -size 960x536 xc:none \
      -fill "rgba(254,215,170,0.92)" -draw "circle ${spark_x},${spark_y} $((spark_x + 4)),${spark_y}" \
      -fill "rgba(251,146,60,0.84)" -draw "circle $((190 + (i * 31) % 230)),$((410 - (i * 29) % 300)) $((194 + (i * 31) % 230)),$((410 - (i * 29) % 300))" \
      -fill "rgba(103,232,249,0.76)" -draw "circle $((605 + (i * 23) % 210)),${ward_y} $((608 + (i * 23) % 210)),${ward_y}" \
      -blur 0x1 "${work_dir}/motes.png"

    magick "${base_image}" \
      "${work_dir}/glow.png" -compose screen -composite \
      "${work_dir}/motes.png" -compose screen -composite \
      "${frame_path}"
  done

  encode_animation "${work_dir}" "${image_dir}/sculpt_fire_motion.webp" 72
}

build_hero
build_cow
build_fire

printf 'Built animated WebP assets:\n'
du -h \
  "${image_dir}/joe_cockpit_motion.webp" \
  "${image_dir}/cow_flight_motion.webp" \
  "${image_dir}/sculpt_fire_motion.webp"
