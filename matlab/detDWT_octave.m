% S is a grayscale container
function R = detDWT_octave()

S = imread('embedded.png');
S = double(S);

W = fwt2(S, 'db8', 1);

[x1, y1] = size(W); % image size

x1half = x1 / 2;
y1half = y1 / 2;

cA = W(1 : x1half, 1 : y1half);
cH = W(x1half+1 : x1, 1 : y1half);
cV = W(1 : x1half, y1half + 1: y1);
cD = W(x1half+1 : x1, y1half + 1: y1);

R = cD;
imwrite(R, 'extracted.png');

