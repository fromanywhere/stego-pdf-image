% C,M is grayscale image filenames
function S = emDWT_octave()

C = imread('container.png');
C = rgb2gray(C);
C = double(C); % container

M = imread('message.png');
M = im2bw(M); % make message binary
M = double(M);

W = fwt2(C, 'db8', 1);

[x, y] = size(M); % message size
[x1, y1] = size(W); % image size

x1half = x1 / 2;
y1half = y1 / 2;

cA = W(1 : x1half, 1 : y1half);
cH = W(x1half+1 : x1, 1 : y1half);
cV = W(1 : x1half, y1half + 1: y1);
cD = W(x1half+1 : x1, y1half + 1: y1);

minWidth = min(x, x1half);
minHeight = min(y, y1half);

Z = cD; % copy of cD for changing

Z(1:minWidth, 1:minHeight) = M(1:minWidth, 1:minHeight); % embedding without overflow
R = [cA, cV; cH, Z];
S = ifwt2(R, 'db8', 1); % reverse slice creation

S = uint8(S);
imwrite(S, 'embedded.png');